import React from 'react';
import './Button.css';

const Button = ({ children, variant = 'primary', loading = false, ...props }) => {
  return (
    <button 
      className={`btn btn-${variant} ${loading ? 'loading' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="spinner"></span> : children}
    </button>
  );
};

export default Button;
