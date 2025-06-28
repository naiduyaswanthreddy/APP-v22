import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
// Remove this import: import { BrowserRouter as Router } from 'react-router-dom';
import LeftNavbar from './components/leftNavbar';
import RightResume from './components/rightResume';
import AboutUs from './components/subcomponents/aboutUs';
import Certification from './components/subcomponents/certifications';
import Education from './components/subcomponents/education';
import Experience from './components/subcomponents/experience';
import Projects from './components/subcomponents/projects';
import Skills from './components/subcomponents/skills';
import CustomSection from './components/subcomponents/CustomSection';

// Update the componentMap object
const componentMap = {
  'About Me': AboutUs,
  'Experience': Experience,
  'Education': Education,
  'Skills': Skills,
  'Projects': Projects,
  'Certifications': Certification,
  // Add a default handler for custom sections
};

// Update the DraggableComponent to handle custom sections
const DraggableComponent = ({ componentName, Component, onAdd, onEdit, onDelete }) => {
  // If it's a standard component, use it directly
  if (Component) {
    return (
      <Reorder.Item
        value={componentName}
        className="p-4 rounded-lg mb-4"
      >
        <Component onAdd={() => onAdd(componentName)} onEdit={() => onEdit(componentName)} onDelete={() => onDelete(componentName)} />
      </Reorder.Item>
    );
  }
  
  // Otherwise, use the CustomSection component
  return (
    <Reorder.Item
      value={componentName}
      className="p-4 rounded-lg mb-4"
    >
      <CustomSection 
        sectionName={componentName} 
        onAdd={() => onAdd(componentName)} 
        onEdit={() => onEdit(componentName)} 
        onDelete={() => onDelete(componentName)} 
      />
    </Reorder.Item>
  );
};

export default function App() {
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [editDeleteVisible, setEditDeleteVisible] = useState({});

  useEffect(() => {
    const savedComponents = JSON.parse(localStorage.getItem('selectedComponents'));
    const savedVisibility = JSON.parse(localStorage.getItem('editDeleteVisible'));
    if (savedComponents) {
      setSelectedComponents(savedComponents);
    }
    if (savedVisibility) {
      setEditDeleteVisible(savedVisibility);
    }
  }, []);

  const handleMenuClick = (componentName) => {
    if (!selectedComponents.includes(componentName)) {
      const newSelectedComponents = [...selectedComponents, componentName];
      setSelectedComponents(newSelectedComponents);
      localStorage.setItem('selectedComponents', JSON.stringify(newSelectedComponents));
    }
    setEditDeleteVisible(prevState => {
      const newState = {
        ...prevState,
        [componentName]: true
      };
      localStorage.setItem('editDeleteVisible', JSON.stringify(newState));
      return newState;
    });
  };

  const handleEdit = (componentName) => {
    console.log(`Editing ${componentName}`);
    localStorage.setItem('edit', componentName);
    
    // Instead of reloading the page, force a re-render
    // by updating a state variable
    setSelectedComponents([...selectedComponents]);
    
    // Alternatively, you could use a dedicated state variable for editing
    // const [editingComponent, setEditingComponent] = useState(null);
    // setEditingComponent(componentName);
  };

  const handleDelete = (componentName) => {
    const newSelectedComponents = selectedComponents.filter(comp => comp !== componentName);
    setSelectedComponents(newSelectedComponents);
    localStorage.setItem('selectedComponents', JSON.stringify(newSelectedComponents));
    localStorage.removeItem(componentName);
    setEditDeleteVisible(prevState => {
      const newState = {
        ...prevState,
        [componentName]: false
      };
      localStorage.setItem('editDeleteVisible', JSON.stringify(newState));
      window.location.reload();
      return newState;
    });
  };

  const handleReorder = (newOrder) => {
    setSelectedComponents(newOrder);
    localStorage.setItem('selectedComponents', JSON.stringify(newOrder));
  };

  return (
    // Remove the <Router> wrapper
    <div className="flex h-screen">
      <LeftNavbar onMenuClick={handleMenuClick} onEdit={handleEdit} onDelete={handleDelete} />
      <div className="w-full ml-20 lg:ml-64 pt-16 lg:pt-0">
        <RightResume>
          <Reorder.Group
            axis="y"
            values={selectedComponents}
            onReorder={handleReorder}
            className="space-y-4"
          >
            {selectedComponents.map((componentName) => {
              const Component = componentMap[componentName];
              return (
                <DraggableComponent
                  key={componentName}
                  componentName={componentName}
                  Component={Component}
                  onAdd={handleMenuClick}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
          </Reorder.Group>
        </RightResume>
      </div>
    </div>
    // Remove the closing </Router> tag
  );
}
