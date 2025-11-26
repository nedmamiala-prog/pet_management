import React from 'react'
import { Link } from 'react-router-dom';
import { BsHeartFill, BsCalendar, BsBarChart, BsFillGearFill, BsCreditCard, BsSpeedometer, BsJournalMedical
 } from 'react-icons/bs';




function Sidebar() {
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
        
      </ul>


    </aside>
  );
}


export default Sidebar;
