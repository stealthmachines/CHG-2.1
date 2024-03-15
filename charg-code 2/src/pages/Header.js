import React from 'react';
import { NavLink } from 'react-router-dom';
import { AccountButton } from "../components/Account";

export const Header = (props) => {
    return (
        <header className='masthead mb-auto'>
            <div className='inner'>
                <h3 className='masthead-brand'>
                    <div className='logo'>
                        <a href='/'>
                            <img className='img img-responsive' src='/images/logo.png' alt='logo'/>
                        </a>
                    </div>
                </h3>
                <nav className='nav nav-masthead justify-content-center'>
                    <NavLink exact to={'/'} className={'nav-link'} >Map</NavLink>
                    <NavLink to={'/register'} className={'nav-link'}>Register</NavLink>
                    <NavLink to={'/bridge'} className={'nav-link'}>Bridge</NavLink>
                    <NavLink to={'/exchange'} className={'nav-link'}>Exchange</NavLink>
                    <NavLink to={'/stats'} className={'nav-link'}>Stats</NavLink>
                    <NavLink to={'/affiliate'} className={'nav-link'}>Affiliate</NavLink>
                </nav>
                <AccountButton />
            </div>
            <div className='inner'>
                <div className='row'>
                    <div className='col-sm-2'>
                    </div>
                    <div className='col-sm-8'>
                        <br/>
                        <h4 className='cover-heading'>{props.title}</h4>
                    </div>
                    <div className='col-sm-2'>
                    </div>
                </div>
            </div>
        </header>
    );
};