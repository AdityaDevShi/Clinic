const fs = require('fs');

async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Debug User',
                email: 'debug@example.com',
                message: 'Debug message to test API failure.',
                subject: 'Debug Subject'
            })
        });

        const data = await response.json();
        const output = `Status: ${response.status}\nBody: ${JSON.stringify(data, null, 2)}`;
        console.log(output);
        fs.writeFileSync('output.txt', output);
    } catch (e) {
        const err = `Script Error: ${e.message}\n${e.stack}`;
        console.error(err);
        fs.writeFileSync('output.txt', err);
    }
}

test();
