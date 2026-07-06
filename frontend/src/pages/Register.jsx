import { useState } from 'react';
import { registerUser } from '../services/authService';

function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await registerUser(form);
      console.log(response.data);
      alert('Registration Successful');
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.detail || 'Registration Failed');
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} />
        <input name="role" placeholder="Role" onChange={handleChange} />
        <button>Register</button>
      </form>
    </div>
  );
}

export default Register;
