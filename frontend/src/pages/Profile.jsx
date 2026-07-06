import DashboardLayout from '../layouts/DashboardLayout';

function Profile() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <DashboardLayout>
      <h1>User Profile</h1>
      <h3>{user?.email}</h3>
    </DashboardLayout>
  );
}

export default Profile;
