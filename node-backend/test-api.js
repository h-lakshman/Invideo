// Simple test script for the shader generation API
const fetch = require('node-fetch');

async function testShaderAPI() {
    try {
        console.log('Testing shader generation API...');

        const response = await fetch('http://localhost:3000/api/shader', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: 'A colorful flowing liquid with ripple effects',
            }),
        });

        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Success:', data.success);

        if (data.success) {
            console.log('Generated shader data:');
            console.log(JSON.stringify(data.data, null, 2));
            console.log('\nFirst 100 characters of raw output:');
            console.log(data.rawOutput.substring(0, 100) + '...');
        } else {
            console.log('Error:', data.error);
            console.log('Raw output:', data.rawOutput);
        }
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testShaderAPI(); 