import React from 'react';

const Input = ({ icon: Icon, className = '', ...props }) => {
  return (
    <div className="relative group w-full">
      {Icon && (
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-brand-primary transition-colors" />
      )}
      <input
        className={`input-field w-full ${Icon ? 'pl-12' : 'pl-4'} ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;
