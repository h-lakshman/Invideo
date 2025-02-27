// Test script to check shader generation API
const fetch = require('node-fetch');

async function testShaderGeneration() {
    const prompt = "A colorful flowing liquid with ripple effects";

    console.log(`Testing shader generation with prompt: "${prompt}"`);
    console.log('Sending request to http://localhost:3000/api/shader...');

    try {
        const response = await fetch('http://localhost:3000/api/shader', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        console.log('\n=== RESPONSE STATUS ===');
        console.log(`Status: ${response.status}`);
        console.log(`Success: ${data.success}`);

        if (data.success) {
            console.log('\n=== SHADER DATA ===');
            if (data.data.vertexShader) {
                console.log('\nVertex Shader:');
                console.log('-------------');
                console.log(data.data.vertexShader.substring(0, 200) + '...');
            }

            if (data.data.fragmentShader) {
                console.log('\nFragment Shader:');
                console.log('---------------');
                console.log(data.data.fragmentShader.substring(0, 200) + '...');
            }

            if (data.data.combinedShader) {
                console.log('\nCombined Shader:');
                console.log('---------------');
                console.log(data.data.combinedShader.substring(0, 200) + '...');
            }

            console.log('\n=== RAW OUTPUT PREVIEW ===');
            console.log(data.rawOutput.substring(0, 300) + '...');

            console.log('\n=== QUALITY CHECK ===');
            // Check for key features in the shader code
            const hasTimeUniform =
                (data.data.vertexShader && data.data.vertexShader.includes('u_time')) ||
                (data.data.fragmentShader && data.data.fragmentShader.includes('u_time')) ||
                (data.data.combinedShader && data.data.combinedShader.includes('u_time'));

            const hasRippleEffect =
                data.rawOutput.toLowerCase().includes('ripple') ||
                data.rawOutput.toLowerCase().includes('wave') ||
                data.rawOutput.toLowerCase().includes('sin(') ||
                data.rawOutput.toLowerCase().includes('cos(');

            const hasColorGradient =
                data.rawOutput.toLowerCase().includes('color') &&
                (data.rawOutput.toLowerCase().includes('mix(') ||
                    data.rawOutput.toLowerCase().includes('blend') ||
                    data.rawOutput.toLowerCase().includes('gradient'));

            console.log(`Time-based animation: ${hasTimeUniform ? 'YES' : 'NO'}`);
            console.log(`Ripple/wave effects: ${hasRippleEffect ? 'YES' : 'NO'}`);
            console.log(`Color gradients: ${hasColorGradient ? 'YES' : 'NO'}`);

            console.log('\n=== CONCLUSION ===');
            if (hasTimeUniform && hasRippleEffect && hasColorGradient) {
                console.log('✅ The generated shader looks good! It includes time-based animation, ripple effects, and color gradients.');
            } else {
                console.log('⚠️ The generated shader may be missing some requested features.');
            }
        } else {
            console.log('\n=== ERROR ===');
            console.log(`Error: ${data.error}`);
            console.log('\n=== RAW OUTPUT ===');
            console.log(data.rawOutput);
        }
    } catch (error) {
        console.error('\n=== REQUEST FAILED ===');
        console.error(`Error: ${error.message}`);
        console.error('Make sure your server is running on http://localhost:3000');
    }
}

testShaderGeneration(); 