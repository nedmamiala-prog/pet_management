import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import heroBg from '../assets/coverphoto.jpg';
import car from '../assets/ca.png';
import about from '../assets/abb.png';


function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);


  const services = [
    {
      icon: "📅",
      title: "Appointment Scheduling",
      description: "Easy online booking system for all your pet's healthcare needs with real-time availability"
    },
    {
      icon: "🩺",
      title: "Health and Vaccination Record",
      description: "Complete digital health records and vaccination tracking for comprehensive pet care"
    },
    {
      icon: "🔔",
      title: "Reminder System",
      description: "Never miss important appointments or medication schedules with smart notifications"
    }
  ];


  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);


  return (
    <div className="app">
      <div className="decorative-elements">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
      </div>


      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo"><div className="paw-icon">🐾</div></div>
            <span className="logo-text">PetCare</span>
          </div>


   <nav className="desktop-nav">
  <span className="nav-link" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Home</span>
  <span className="nav-link" onClick={() => document.getElementById('services').scrollIntoView({behavior: 'smooth'})}>Services</span>
  <span className="nav-link" onClick={() => document.getElementById('appointment').scrollIntoView({behavior: 'smooth'})}>Appointment</span>
  <span className="nav-link" onClick={() => document.getElementById('about').scrollIntoView({behavior: 'smooth'})}>About</span>
</nav>


          <button className="login-button" onClick={() => navigate('/login')}>Login</button>


          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>


        {isMenuOpen && (
          <div className="mobile-menu">
            <a href="/" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="#/about" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="#/appointment" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Services</a>
            <a href="/login" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Login</a>
            <button className="mobile-login-btn" onClick={() => navigate('/login')}>Login</button>
          </div>
        )}
      </header>


      <section id="home" className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className={`hero-title ${isVisible ? 'animate-in' : ''}`}>
              Smart Scheduling,{' '}
              <span className="text-blue">Healthier Pets</span>,{' '}
              <span className="text-purple">Happier Owners</span>.
            </h1>
            <p className={`hero-subtitle ${isVisible ? 'animate-in delay-1' : ''}`}>
              Because Every Paw Deserves Perfect Care
            </p>
            <button className={`cta-btn ${isVisible ? 'animate-in delay-2' : ''}`} onClick={() => navigate('/login')}>
              Let’s get started!
            </button>
          </div>
        </div>
      </section>


      <section id="services" className="services">
        <div className="services-content">
          <div className="services-header">
            <h2 className="services-title">
              Services <span className="text-bl">PetCare</span> offers:
            </h2>
            <p className="services-subtitle">
              Providing our patients with the most comprehensive range of services and the highest
              quality in veterinary care that always has been our top priority at PetCare.
            </p>
          </div>


          <div className="services-grid">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon"><span>{service.icon}</span></div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section id='appointment' className='appointment'>
      <div className="app-container">
      <div className="app-content">
        <div className="app-section">
          <h1 className="app-title">
            Your Pet's Health,
            <br />
            Just a Click Away!
          </h1>
          <p className="app-description">
            Book, reschedule, or cancel vet visits easily.
            <br />
            Syncs with Google Calendar to avoid double
            <br />
            bookings and sends instant updates on
            <br />
            appointment status.
          </p>
         <button className="book-button" onClick={() => navigate('/appointment')}>
        Book Appointment
      </button>


        </div>

        <div className="image-section">
          <div className="decorative-circles">
            <div className="circle circle-1"></div>
            <div className="circle circle-2"></div>
            <div className="circle circle-3"></div>
            <div className="circle circle-4"></div>
          </div>
          <div className="image-frame" style={{ backgroundImage: `url(${car})` }}>
            <img
              className="app-image"
            />
          </div>
        </div>
      </div>
      </div>
      </section>


      <section id='about' className='about'>
      <div className="about-content">
          <div className="about-header">
            <h2 className="about-title">
              About <span className="text-about">PetCare</span>
            </h2>
          </div>

          <div className="about-section">
          <h1 className="about-title-bl">
            PetCare
          </h1>
          <p className="about-description">
            Pet Care Appointment and Health Management System 
            <br />
            that offers records, scheduling, and billing into one platform
            <br />
            while offering features that support timely updates and better
            <br />
            better monitoring of pet health. Our mission is to provide
            <br />
            a seamless and efficient way for pet owners to manage their
            <br />
            pets' health and appointments, ensuring happier and
            <br />
             healthier lives for your furry friends.
          </p>
          </div>

        <div className="ab-image-section">
          <div className="ab-image-frame" style={{ backgroundImage: `url(${about})` }}>
            <img
              className="ab-app-image"
            />
          </div>
        </div>

      </div>
      </section>

      <footer id="contact" className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-footer"><div className="paw-icon">🐾</div></div>
            <span className="logo-text-footer">PetCare</span>
          </div>
          <p className="footer-text">© 2025 PetCare. All rights reserved. Made with ❤️ for pets and their families.</p>
        </div>
      </footer>
    </div>
   
  );
}


export default Home;
