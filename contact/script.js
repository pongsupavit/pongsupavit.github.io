// Handle card flip with device orientation
window.addEventListener('deviceorientation', (event) => {
    let alpha = event.alpha;
    let beta = event.beta;
    let gamma = event.gamma;
    // Adjust the card's rotation based on device orientation
    document.getElementById('card').style.transform = `rotateY(${gamma}deg) rotateX(${beta}deg)`;
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
