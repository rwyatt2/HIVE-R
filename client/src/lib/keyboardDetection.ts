/**
 * Keyboard Detection
 * 
 * Detect keyboard vs mouse navigation for focus styling.
 */

export function initKeyboardDetection(): void {
    // Detect Tab key usage
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-user');
        }
    });

    // Remove on mouse click
    window.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-user');
    });
}

export default initKeyboardDetection;
