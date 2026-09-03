import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { adminAuth, adminDb } from '../../../../firebase/firebaseAdmin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const tools = [
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Add a new task to the user's To-Do list",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title or description of the task" },
          date: { type: "string", description: "The due date of the task in YYYY-MM-DD format. Leave empty if no specific date is mentioned." },
          time: { type: "string", description: "The exact time in 24-hour HH:mm format (e.g., '16:00' for 4 PM). Leave empty if no specific time is mentioned." },
          recurrence: { type: "string", enum: ["none", "daily", "weekly", "monthly"], description: "The recurrence rule. Use 'none' for one-time tasks." }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark an existing task as completed using its ID.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "The ID of the task to mark as completed. You MUST extract this from the provided Context data which lists [ID: xyz]." }
        },
        required: ["taskId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "add_meeting_note",
      description: "Create a short meeting note or summary dictated by the user.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "A brief title for the meeting (e.g. 'Meeting with Rahul')" },
          summary: { type: "string", description: "The transcribed summary or notes about the meeting." },
          actionItems: {
            type: "array",
            items: { type: "string" },
            description: "A list of follow-ups or action items extracted from the note, if any."
          }
        },
        required: ["title", "summary"]
      }
    }
  }
];

export async function POST(req) {
  try {
    const { message, context, idToken } = await req.json();

    if (!message || !idToken) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const isoToday = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are a helpful, professional AI Voice Assistant for a user's digital dashboard.
You help them manage their schedule, to-do lists, and meetings. Keep your answers brief, conversational, and easy to understand when spoken aloud. 
Do not use markdown formatting (like **bold** or bullet points) since your output will be read by a text-to-speech engine.

If the user asks to add a task or reminder, use the add_task tool. If they mention a specific time (like "4 PM"), convert it to HH:mm format for the time argument. If they say "every day", "weekly", etc., set the recurrence argument appropriately. If they ask to mark a task as completed or done, find the matching ID from the context and use the complete_task tool. 
If the user asks about their meetings, follow-ups, or notes, use the "RECENT MEETINGS" section in your context to answer them accurately. If they ask you to extract tasks from a meeting, look at the Action Items in the RECENT MEETINGS context and call the add_task tool for each one.
If the user dictates a short meeting note, use the add_meeting_note tool to save it.
Always confidently confirm what you did to the user.

Today's date is: ${today} (YYYY-MM-DD: ${isoToday})

User's Dashboard Data (To-Dos and Meetings):
${context || 'No data available.'}
`;

    let messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    let completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      tools: tools,
      tool_choice: "auto",
      max_tokens: 200,
      temperature: 0.7,
    });

    let responseMessage = completion.choices[0].message;

    // Handle tool calls
    if (responseMessage.tool_calls) {
      messages.push(responseMessage); // Add the assistant's tool call request to the history

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'add_task') {
          const args = JSON.parse(toolCall.function.arguments);
          const taskDate = args.date || isoToday;
          const taskTime = args.time || '';
          const recurrence = args.recurrence || 'none';

          await adminDb.collection('todos').add({
            userId: decodedToken.uid,
            title: args.title,
            taskDate: taskDate,
            taskTime: taskTime,
            recurrence: recurrence,
            status: 'pending',
            createdAt: new Date().toISOString()
          });

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "add_task",
            content: "Task added successfully to the database."
          });
        } else if (toolCall.function.name === 'complete_task') {
          const args = JSON.parse(toolCall.function.arguments);

          // Security Check: Verify task belongs to user
          const taskRef = adminDb.collection('todos').doc(args.taskId);
          const taskSnap = await taskRef.get();

          if (taskSnap.exists && taskSnap.data().userId === decodedToken.uid) {
            await taskRef.update({ status: 'completed' });
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "complete_task",
              content: "Task marked as completed successfully."
            });
          } else {
            messages.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "complete_task",
              content: "Failed: Task ID not found or unauthorized."
            });
          }
        } else if (toolCall.function.name === 'add_meeting_note') {
          const args = JSON.parse(toolCall.function.arguments);

          await adminDb.collection('meetingNotes').add({
            userId: decodedToken.uid,
            title: args.title,
            summary: args.summary,
            transcript: args.summary, // using summary as transcript for short voice notes
            actionItems: args.actionItems || [],
            createdAt: new Date().toISOString(),
            meetingDate: new Date().toISOString(),
            duration: 0
          });

          messages.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "add_meeting_note",
            content: "Meeting note added successfully."
          });
        }
      }

      // Make second call to OpenAI to get the final spoken confirmation
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
      });
      responseMessage = completion.choices[0].message;
    }

    const reply = responseMessage.content?.trim() || "I'm sorry, I couldn't process that request.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error in voice assistant chat:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
