'use client';
import React, { useState, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../../firebase/firebase';
import { toast, ToastContainer } from 'react-toastify';

const ImportPage = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const csvFileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      toast.error('Please upload a valid CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length === 0) {
        toast.error('CSV file is empty.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const previewData = [];
      
      for (let i = 1; i < Math.min(6, lines.length); i++) { // Preview first 5 rows
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        previewData.push(row);
      }
      
      setImportPreview(previewData);
      setShowPreview(true);
    };

    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!user) {
      toast.error('Authentication required to import contacts.');
      return;
    }

    const file = csvFileInputRef.current?.files[0];
    if (!file) {
      toast.error('Please select a CSV file to import.');
      return;
    }

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim() !== '');

      if (lines.length === 0) {
        toast.error('CSV file is empty.');
        setIsImporting(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['name', 'email', 'phone', 'company', 'title', 'notes'];
      
      const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh));
      if (missingHeaders.length > 0) {
        toast.error(`Missing required CSV headers: ${missingHeaders.join(', ')}`);
        setIsImporting(false);
        return;
      }

      const contactsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length !== headers.length) {
          console.warn(`Skipping malformed row ${i + 1}`);
          continue;
        }

        const contact = {};
        headers.forEach((header, index) => {
          contact[header] = values[index] ? values[index].trim() : '';
        });

        if (!contact.name) {
          console.warn(`Skipping row ${i + 1}: Name is empty.`);
          continue;
        }

        contactsToImport.push({
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          title: contact.title,
          notes: contact.notes,
          labels: [],
          groups: [],
          userId: user.uid,
          source: 'CSV Import',
          dateAdded: serverTimestamp(),
          lastInteractionDate: serverTimestamp(),
        });
      }

      if (contactsToImport.length === 0) {
        toast.info('No valid contacts found in the CSV file to import.');
        setIsImporting(false);
        return;
      }

      let importedCount = 0;
      for (const contact of contactsToImport) {
        try {
          await addDoc(collection(db, 'contacts'), contact);
          importedCount++;
        } catch (error) {
          console.error('Error adding contact from CSV:', contact, error);
        }
      }

      toast.success(`Successfully imported ${importedCount} contacts!`);
      csvFileInputRef.current.value = '';
      setShowPreview(false);
      setImportPreview([]);
      setIsImporting(false);
    };

    reader.onerror = () => {
      toast.error('Error reading CSV file.');
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/signin');
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Contacts</h1>
        <p className="text-gray-600">Upload a CSV file to import multiple contacts at once</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">CSV Format Requirements</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 mb-2">Your CSV file should include these columns (headers are case-insensitive):</p>
          <code className="bg-white px-2 py-1 rounded text-sm">Name,Email,Phone,Company,Title,Notes</code>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><strong>Name:</strong> Required field</div>
          <div><strong>Email:</strong> Optional contact email</div>
          <div><strong>Phone:</strong> Optional phone number</div>
          <div><strong>Company:</strong> Optional company name</div>
          <div><strong>Title:</strong> Optional job title</div>
          <div><strong>Notes:</strong> Optional additional notes</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="text-4xl mb-4">📄</div>
          <input
            type="file"
            accept=".csv"
            ref={csvFileInputRef}
            onChange={handleFileSelect}
            className="mb-4"
          />
          <p className="text-gray-600 mb-4">Select a CSV file to upload and import contacts</p>
          
          {showPreview && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b text-left">Name</th>
                      <th className="px-4 py-2 border-b text-left">Email</th>
                      <th className="px-4 py-2 border-b text-left">Phone</th>
                      <th className="px-4 py-2 border-b text-left">Company</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2">{row.email}</td>
                        <td className="px-4 py-2">{row.phone}</td>
                        <td className="px-4 py-2">{row.company}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <button
            onClick={handleImportCsv}
            disabled={isImporting || !csvFileInputRef.current?.files[0]}
            className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </div>
            ) : (
              'Import Contacts'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
