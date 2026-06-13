document.addEventListener('DOMContentLoaded', function() {
    const BASE_API_URL = `${window.location.origin}/bkinventory/api/auth`;

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            // Hide all content sections
            document.querySelectorAll('.tab-pane').forEach(content => {
                content.style.display = 'none'; // Hide all sections
            });

            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => {
                t.classList.remove('active');
            });

            // Show the corresponding content section
            const targetContent = document.querySelector(this.getAttribute('data-target'));
            if (targetContent) {
                targetContent.style.display = 'block'; // Show the selected section
            }

            // Add active class to the clicked tab
            this.classList.add('active');
        });
    });

    // Check if an active tab exists before simulating a click
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        activeTab.click(); // Simulate a click on the active tab
    }

    // Optionally, set the default active tab on page load
    //document.querySelector('.tab.active').click(); // Simulate a click on the active tab

    document.getElementById('login')?.addEventListener('click', () => handleLogin(BASE_API_URL));
    document.getElementById('register')?.addEventListener('click', () => handleRegister(BASE_API_URL));
    document.getElementById('resetPasswordButton')?.addEventListener('click', () => handleResetPassword(BASE_API_URL));
});

// Handle login
function handleLogin(BASE_API_URL) {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    if (!username || !password) {
        showMessage(messageDiv, 'Please enter both username and password', 'error');
        return;
    }

    // Log the request for debugging
    console.log('Sending login request to:', BASE_API_URL);
    
    fetch(`${BASE_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'login',
            username: username,
            password: password
        })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Login response:', data);
        if (data.success) {
            showMessage(messageDiv, 'Login successful! Redirecting...', 'success');
            window.location.href = 'index.php';
        } else {
            showMessage(messageDiv, data.error || 'Invalid username or password', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage(messageDiv, 'An error occurred during login', 'error');
    });
}

// Handle register
function handleRegister(BASE_API_URL) {
    const fullName = document.getElementById('registerFullName').value;
    const username = document.getElementById('registerUsername').value;
    const password1 = document.getElementById('registerPassword1').value;
    const password2 = document.getElementById('registerPassword2').value;
    const messageDiv = document.getElementById('registerMessage');

    if (!fullName || !username || !password1 || !password2) {
        showMessage(messageDiv, 'Please fill in all fields', 'error');
        return;
    }

    if (password1 !== password2) {
        showMessage(messageDiv, 'Passwords do not match', 'error');
        return;
    }

    fetch(`${BASE_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'register',
            fullName: fullName,
            username: username,
            password: password1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(messageDiv, 'Registration successful! Please login.', 'success');
            setTimeout(() => {
                window.location.href = 'login.php';
            }, 2000);
        } else {
            showMessage(messageDiv, data.error || 'Registration failed', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showMessage(messageDiv, 'An error occurred during registration', 'error');
    });
}

// Handle reset password
function handleResetPassword(BASE_API_URL) {
    const username = document.getElementById('resetPasswordUsername').value;
    const password1 = document.getElementById('resetPasswordPassword1').value;
    const password2 = document.getElementById('resetPasswordPassword2').value;
    const messageDiv = document.getElementById('resetPasswordMessage');

    if (!username || !password1 || !password2) {
        showMessage(messageDiv, 'Please fill in all fields', 'error');
        return;
    }

    if (password1 !== password2) {
        showMessage(messageDiv, 'Passwords do not match', 'error');
        return;
    }

    fetch(`${BASE_API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'resetPassword',
            username: username,
            password: password1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage(messageDiv, 'Password reset successfully', 'success');
        } else {
            showMessage(messageDiv, data.error || 'An error occurred', 'error');
        }
    })
    .catch(error => {
        showMessage(messageDiv, 'Network error: ' + error.message, 'error');
    });
}

// Helper function to show messages
function showMessage(element, message, type) {
    if (!element) return;

    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    element.className = `alert ${alertClass}`;
    element.textContent = message;
    element.style.display = 'block';
}
