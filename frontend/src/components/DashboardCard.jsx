function DashboardCard({ title, value }) {
  return (
    <div
      style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0px 2px 5px gray',
        width: '200px'
      }}
    >
      <h3>{title}</h3>
      <h1>{value}</h1>
    </div>
  );
}

export default DashboardCard;
