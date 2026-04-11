import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScannerComponent = ({ onScanSuccess, onScanFailure }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        const scanner = new Html5QrcodeScanner("reader", config, false);
        scannerRef.current = scanner;

        scanner.render(
            (decodedText, decodedResult) => {
                if (onScanSuccess) {
                    onScanSuccess(decodedText);
                    scanner.clear(); // stop scanning after success
                }
            },
            (error) => {
                if (onScanFailure) {
                    onScanFailure(error);
                }
            }
        );

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
        };
    }, []);

    return <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>;
};

export default QRScannerComponent;
