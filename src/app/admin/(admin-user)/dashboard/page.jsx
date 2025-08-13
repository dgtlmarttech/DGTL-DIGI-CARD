'use client'
import React,{useEffect} from 'react';
import { Megaphone, Users, Mail, Link2 } from 'lucide-react';
import './Home.css'; // Import the CSS file

const Home = () => (
  <div className="home-container">
    <h1 className="home-title">Admin Dashboard Overview</h1>
    <p className="home-intro">Manage your website efficiently with these key features:</p>

    <div className="features-grid">
      <div className="feature-card banner">
        <div className="feature-icon-container">
        <Megaphone className="feature-icon" />
        </div>
        <h2 className='banner-heading'>Banner Ad</h2>
        <p>Control banner ads with two options: manually upload an image and link or use Google AdSense.</p>
      </div>

      <div className="feature-card user-info">
        <div className="feature-icon-container">
        <Users className="feature-icon" />
        </div>
        <h2 className='user-heading'>User Info</h2>
        <p>View users in four categories: Free-tier, Premium, Expired Premium, and Blocked users.</p>
      </div>

      <div className="feature-card mailer">
        <div className="feature-icon-container">
        <Mail className="feature-icon" />
        </div> 
        <h2 className='mailer-heading'>Mailer</h2>
        <p>Manage emails, edit messages, or use pre-built templates for communication.</p>
      </div>

      <div className="feature-card affiliate">
      <div className="feature-icon-container">
        <Link2 className="feature-icon" />
        </div>
        <h2 className='affiliate-heading'>Affiliate Section</h2>
        <p>Track affiliate marketing performance and calculate affiliate earnings.</p>
      </div>
    </div>
  </div>
);

export default Home;
