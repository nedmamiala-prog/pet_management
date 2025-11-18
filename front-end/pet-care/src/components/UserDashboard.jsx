import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UserDashboard.css';
import heroBg from '../assets/coverphoto.jpg';
import car from '../assets/ca.png';
import about from '../assets/abb.png';
import profile from '../assets/dp.png';
import notify from '../assets/notif.png';
import Appointment from './Appointment';
import Notification from './Notification';
import { logoutUser } from '../api/authApi';

function UserDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [notification, setNotification] = useState(null);
  

  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle modal open/close by hash
  useEffect(() => {
    if (location.hash === '#appointment') {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [location.hash]);

  const openAppointment = () => {
    if (location.hash !== '#appointment') {
      navigate('#appointment');
    }
    setShowModal(true);
  };

  const closeAppointment = () => {
    navigate('#home');
    setShowModal(false);
  };

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const showNotificationAlert = (title, message, type = 'info') => {
    setNotification({ title, message, type });
  };

  const handleNotificationClick = () => {
    // Example schedule notifications
    const scheduleNotifications = [
      {
        title: '📅 Upcoming Appointment',
        message: 'Your pet has a vaccination appointment on Nov 20, 2025 at 2:00 PM',
        type: 'info'
      },
      {
        title: '⏰ Appointment Reminder',
        message: 'Grooming session scheduled for tomorrow at 10:00 AM',
        type: 'warning'
      },
      {
        title: '✅ Appointment Completed',
        message: 'Health checkup was completed successfully',
        type: 'success'
      },
      {
        title: '🔔 Pending Vaccination',
        message: 'Your pet needs a booster shot. Book an appointment now!',
        type: 'warning'
      }
    ];

    const randomNotification = scheduleNotifications[Math.floor(Math.random() * scheduleNotifications.length)];
    showNotificationAlert(randomNotification.title, randomNotification.message, randomNotification.type);
  };

  const services = [
    {
      icon: '🐶',
      title: 'General Check-up',
      description:
        'Regular wellness exams to ensure your pet’s overall health, detect early signs of illness, and maintain their well-being.',
    },
    {
      icon: '💉',
      title: 'Vaccination',
      description:
        'Comprehensive vaccination programs to protect your pets from common and preventable diseases.',
    },
    {
      icon: '✂️',
      title: 'Grooming',
      description:
        'Professional grooming services to keep your pet clean, comfortable, and looking their best.',
    },
    {
      icon: '🦷',
      title: 'Dental Cleaning',
      description:
        'Thorough dental care and cleaning to prevent plaque buildup, gum disease, and bad breath in your pets.',
    },
    {
      icon: '🚑',
      title: 'Emergency Visit',
      description:
        'Immediate care for urgent medical conditions because your pet’s health can’t wait.',
    },
  ];

  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % services.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      {notification && (
        <Notification
          title={notification.title}
          message={notification.message}
          type={notification.type}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Decorative elements */}
      <div className="decorative-elements">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
      </div>

      {/* HEADER */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo"><div className="paw-icon">🐾</div></div>
            <span className="logo-text">PetCare</span>
          </div>

          <nav className="desktop-nav">
            <a href="#home" className="nav-link">Home</a>
            <a href="#services" className="nav-link">Services</a>
            <a
              href="#appointment"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                openAppointment();
              }}
            >
              Appointment
            </a>
            <a href="#about" className="nav-link">About</a>
          </nav>

          <div className="profile">
            <button 
              className="notify-btn"
              onClick={handleNotificationClick}
              title="View schedule notifications"
            >
              <div
                className="notif"
                style={{ backgroundImage: `url(${notify})` }}
              ></div>
            </button>
            <div
              className="prof"
              onClick={() => navigate('/profile')}
              style={{ backgroundImage: `url(${profile})` }}
            ></div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <button className="mobile-menu-btn" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <a href="#home" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="#about" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>About</a>
            <a href="#services" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Services</a>
            <a href="#contact" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Contact</a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="hero" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className={`hero-title ${isVisible ? 'animate-in' : ''}`}>
              Smart Scheduling, <span className="text-blue">Healthier Pets</span>,{' '}
              <span className="text-purple">Happier Owners</span>.
            </h1>
            <p className={`hero-subtitle ${isVisible ? 'animate-in delay-1' : ''}`}>
              Because Every Paw Deserves Perfect Care
            </p>
            <button
              className={`cta-btn ${isVisible ? 'animate-in delay-2' : ''}`}
              onClick={openAppointment}
            >
              Book Now!
            </button>
          </div>
        </div>
      </section>

      {/* SERVICES */}
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

          <div className="services-carousel">
            <div
              className="services-track"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {services.map((service, index) => (
                <div key={index} className="service-card">
                  <div className="service-icon"><span>{service.icon}</span></div>
                  <h3 className="service-title">{service.title}</h3>
                  <p className="service-description">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* APPOINTMENT SECTION */}
      <section id="appointment" className="appointment">
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

              <button className="book-button" onClick={openAppointment}>
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
                <img className="app-image" alt=""/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="about">
        <div className="about-content">
          <div className="about-header">
            <h2 className="about-title">
              About <span className="text-about">PetCare</span>
            </h2>
          </div>

          <div className="about-section">
            <h1 className="about-title-bl">PetCare</h1>
            <p className="about-description">
              Pet Care Appointment and Health Management System
              <br />
              that offers records, scheduling, and billing into one platform
              <br />
              while offering features that support timely updates and better
              <br />
              monitoring of pet health. Our mission is to provide
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
              <img className="ab-app-image" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="footer">
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo-footer"><div className="paw-icon">🐾</div></div>
            <span className="logo-text-footer">PetCare</span>
          </div>
          <p className="footer-text">
            © 2025 PetCare. All rights reserved. Made with ❤️ for pets and their families.
          </p>
        </div>
      </footer>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={closeAppointment}>✖</button>
            <Appointment closeModal={closeAppointment} />
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
