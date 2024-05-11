const http = require('http');
const https = require('https');

const NReq = {
    request: (method, protocol, host, path, payload, headers) => {
        const options = { method, headers };

        const req = (protocol === 'https' ? https : http).request(
            { ...options, host, path },
            (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('Result:', data);
                });
            }
        );

        req.on('error', (error) => {
            console.error('Request error:', error);
        });

        if (payload) {
            req.write(payload);
        }

        req.end();
    },

    get: (protocol, host, port, path) => {
        http.get(`${protocol}://${host}:${port}${path}`, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('Result:', data);
            });
        }).on('error', (error) => {
            console.error('GET request error:', error);
        });
    },

    post: (protocol, host, port, path, payload) => {
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' }
        };
        // console.log('protocal', protocol, 'host', host, 'path', path,'payload', payload);
        const req = (protocol === 'https' ? https : http).request(
            { ...options, host, port, path },
            (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('Result:', data);
                });
            }
        );

        req.on('error', (error) => {
            console.error('POST request error:', error);
        });

        if (payload) {
            req.write(JSON.stringify(payload));
        }

        req.end();
    }
};

module.exports = NReq;