import React from 'react'
import logo from '../../assets/logo.png'

export default function Header(){
  return (
    <header className="header">
      <div className="header-inner">
        <img src={logo} alt="Lazertur" className="logo-img" />
        <div className="brand">
          <h2>Lazertur</h2>
          <small>Assistente Lu</small>
        </div>
      </div>
    </header>
  )
}
