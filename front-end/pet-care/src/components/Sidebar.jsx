import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { BsHeartFill, BsCalendar, BsBarChart, BsFillGearFill, BsCreditCard, BsSpeedometer, BsJournalMedical, BsBoxArrowRight
 } from 'react-icons/bs';




function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <aside id='sidebar'>
      <div className= 'sidebar-title'>
        <div className= 'sidebar-brand'>
            <div className='icon_header'/> 🐾PetCare.
        </div>


      </div>
      <ul className= 'sidebar-list'>
        <li className= 'sidebar-list-item'>
            <Link to="/Admin">
                <BsSpeedometer className='icon'/> Dashboard
                </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/admin/pet-records">
                <BsJournalMedical className='icon'/> Pet Records
                </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/admin/appointments">
                <BsCalendar className='icon'/> Appointments
                </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/admin/analytics">
                <BsBarChart className='icon'/> Analytics
                </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <Link to="/admin/billing">
                <BsCreditCard className='icon'/> Billing
                </Link>
        </li>
        <li className= 'sidebar-list-item'>
            <a onClick={handleLogout} style={{ cursor: 'pointer' }}>
                <BsBoxArrowRight className='icon'/> Logout
            </a>
        </li>
      </ul>


    </aside>
  );
}


export default Sidebar;