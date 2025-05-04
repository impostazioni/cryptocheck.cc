 document.addEventListener('DOMContentLoaded', () => {
    let refPriceBTC = null;
    let refPriceSOL = null;

    // Connection status elements
    const connectionStatus = document.getElementById('connection-status');
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.querySelector('.status-text');

    // Function to update the connection status
    const updateConnectionStatus = (status) => {
        connectionStatus.className = ''; // Reset classes
        switch (status) {
            case 'connected':
                connectionStatus.classList.add('connected');
                statusText.textContent = 'Connected';
                break;
            case 'not-connected':
                connectionStatus.classList.add('not-connected');
                statusText.textContent = 'Not Connected';
                break;
            case 'connecting':
                connectionStatus.classList.add('connecting');
                statusText.textContent = 'Connecting...';
                break;
            default:
                break;
        }
    };

    // Function to update a single digit in the LED display
    const updateDigit = (digitElement, number) => {
        const segmentMap = {
            "0": ["a", "b", "c", "d", "e", "f"],
            "1": ["b", "c"],
            "2": ["a", "b", "g", "e", "d"],
            "3": ["a", "b", "g", "c", "d"],
            "4": ["f", "g", "b", "c"],
            "5": ["a", "f", "g", "c", "d"],
            "6": ["a", "f", "g", "c", "d", "e"],
            "7": ["a", "b", "c"],
            "8": ["a", "b", "c", "d", "e", "f", "g"],
            "9": ["a", "b", "c", "d", "f", "g"]
        };
        
        const segments = digitElement.querySelectorAll('.segment');
        const activeSegments = segmentMap[number] || [];
        
        segments.forEach(segment => {
            segment.classList.remove('on');
        });

        activeSegments.forEach(segmentClass => {
            digitElement.querySelector(`.segment.${segmentClass}`).classList.add('on');
        });
    };

    // Function to update the entire LED display with the new price
    const updatePrice = (price, displayId, isBTC) => {
        // Format the price with the correct number of digits and decimals
        const digits = price.toString().padStart(isBTC ? 6 : 5, '0').split('.');
        
        // Get all digit elements
        const digitElements = document.querySelectorAll(`#${displayId} .digit`);
        
        // Update the digits before the decimal point
        digits[0].split('').forEach((digit, index) => {
            updateDigit(digitElements[index], digit);
        });
        
        // If there is a decimal part, update it
        if (digits[1]) {
            digits[1].split('').forEach((digit, index) => {
                // Ensure we have enough digit elements to handle the decimal part
                if (digitElements[index + digits[0].length]) {
                    updateDigit(digitElements[index + digits[0].length], digit);
                }
            });
        }
    };

    // Function to connect to the WebSocket and handle updates
    const connectWebSocket = (symbol, displayId, isBTC) => {
        updateConnectionStatus('connecting'); // Set status to connecting
        const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
        
        socket.onopen = () => {
            console.log(`${symbol} WebSocket Connected`);
            updateConnectionStatus('connected'); // Set status to connected
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const price = parseFloat(data.p).toFixed(isBTC ? 0 : 2);  // Ensure 2 decimals for SOL

            // Update the reference price for BTC or SOL
            if (isBTC) {
                refPriceBTC = price;
            } else {
                refPriceSOL = price;
            }

            // Update the display with the new price
            updatePrice(price, displayId, isBTC);
        };

        socket.onclose = () => {
            console.log(`${symbol} WebSocket Disconnected`);
            updateConnectionStatus('not-connected'); // Set status to not connected
        };

        socket.onerror = (error) => {
            console.error(`${symbol} WebSocket Error:`, error);
            updateConnectionStatus('not-connected'); // Set status to not connected
        };
    };

    // Connect WebSockets for both BTC and SOL
    connectWebSocket('btcusdt', 'btc-display', true);
    connectWebSocket('solusdt', 'sol-display', false);
});