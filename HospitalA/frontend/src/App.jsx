import React from 'react';
import RoutesComponent from './routes';
import HospitalNavbar from './components/HospitalNavbar';

const App = () => {
  return (
    <div>
      <HospitalNavbar />
      <RoutesComponent />
    </div>
  );
};

export default App;
