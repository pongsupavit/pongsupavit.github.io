// Handle card movement with mouse
document.addEventListener('mousemove', (event) => {
    const card = document.getElementById('card');
    const { clientX: x, clientY: y } = event;
    const { innerWidth: width, innerHeight: height } = window;
    
    // Calculate rotation based on mouse position
    const xRotation = ((y / height) - 0.5) * 20;
    const yRotation = ((x / width) - 0.5) * -20;

    card.style.transform = `rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;

    // Create a floating effect with shadow
    const shadowX = (y / height - 0.5) * 20;
    const shadowY = (x / width - 0.5) * 20;
    card.style.boxShadow = `${shadowX}px ${shadowY}px 30px rgba(0, 0, 0, 0.2)`;
});

// Handle card flip with device orientation
window.addEventListener('deviceorientation', (event) => {
    const alpha = event.alpha || 0;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;
    
    // Apply 3D rotation based on device orientation
    const card = document.getElementById('card');
    card.style.transform = `rotateY(${gamma}deg) rotateX(${beta}deg)`;
    
    // Update shadow based on rotation for a more dynamic effect
    const shadowX = Math.sin(gamma * Math.PI / 180) * 20;
    const shadowY = Math.sin(beta * Math.PI / 180) * 20;
    card.style.boxShadow = `0 ${shadowY}px ${shadowX}px rgba(0, 0, 0, 0.3)`;
});

// Save contact button functionality
document.getElementById('save-button').addEventListener('click', () => {
    const contact = {
        name: "John Doe",
        email: "john.doe@example.com",
        linkedin: "https://linkedin.com/in/johndoe"
    };
    // Use the VCard format for saving the contact
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
EMAIL:${contact.email}
URL:${contact.linkedin}
END:VCARD`;

    const blob = new Blob([vCard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact.vcf';
    a.click();
    URL.revokeObjectURL(url);
});
