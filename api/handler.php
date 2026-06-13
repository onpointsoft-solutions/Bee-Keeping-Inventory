<?php
// Prevent PHP from outputting errors as HTML
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/api_errors.log');

// Set JSON content type
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Start session for authentication
session_start();

// Handle fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Fatal error: ' . $error['message']
        ]);
        exit();
    }
});

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get database connection
try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->connect();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}

// Load controllers
require_once(__DIR__ . '/controllers/auth.php');
require_once(__DIR__ . '/../controllers/production/ProductionController.php');
require_once(__DIR__ . '/../controllers/equipment/EquipmentController.php');
require_once(__DIR__ . '/../controllers/hive/HiveController.php');
require_once(__DIR__ . '/../controllers/health/HealthController.php');
require_once(__DIR__ . '/../controllers/reports/ReportsController.php');

// Parse the request URI to determine the endpoint
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/bkinventory/api/';

// Extract the path after the base path
$path = '';
if (strpos($requestUri, $basePath) === 0) {
    $path = substr($requestUri, strlen($basePath));
}

// Split the path into segments
$pathSegments = explode('/', trim($path, '/'));

// Get the endpoint (first segment)
$endpoint = !empty($pathSegments) ? $pathSegments[0] : '';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get parameters
$params = [];
if ($method === 'GET') {
    $params = $_GET;
} else if ($method === 'POST') {
    // First try to get JSON data from request body
    $postData = file_get_contents('php://input');
    error_log("Raw POST data: " . $postData);
    
    if (!empty($postData)) {
        $decodedData = json_decode($postData, true);
        if ($decodedData !== null) {
            $params = $decodedData;
            error_log("Decoded JSON data: " . print_r($params, true));
        } else {
            // Log JSON decode error
            error_log("JSON decode error for POST data: " . $postData . " - Error: " . json_last_error_msg());
        }
    }
    
    // Also merge in any form-encoded POST data
    if (!empty($_POST)) {
        error_log("Form POST data: " . print_r($_POST, true));
        $params = array_merge($params, $_POST);
    }
}

// Add any additional path segments as parameters
if (count($pathSegments) > 1) {
    $params['id'] = $pathSegments[1];
    
    // Add any additional path segments as parameters
    for ($i = 2; $i < count($pathSegments); $i += 2) {
        if (isset($pathSegments[$i + 1])) {
            $params[$pathSegments[$i]] = $pathSegments[$i + 1];
        }
    }
}

// Log the request for debugging
error_log("API Request: $method $requestUri - Endpoint: $endpoint - Raw Params: " . print_r($params, true));
error_log("POST Data: " . file_get_contents('php://input'));
error_log("_POST: " . print_r($_POST, true));
error_log("_GET: " . print_r($_GET, true));

// Default response
$response = [
    'success' => false,
    'error' => 'Invalid endpoint'
];

try {
    // Route request to appropriate controller
    switch($endpoint) {
        case 'auth':
            // Authentication handling
            $authController = new AuthController($db);
            switch($params['action'] ?? '') {
                case 'login':
                    $response = $authController->login($params);
                    break;
                case 'register':
                    $response = $authController->register($params);
                    break;
                case 'resetPassword':
                    $response = $authController->resetPassword($params);
                    break;
                default:
                    throw new Exception('Invalid auth action: ' . ($params['action'] ?? ''));
            }
            break;

        case 'beehive':
        case 'hive':
            // Check authentication for protected routes
            if (!isset($_SESSION['loggedIn'])) {
                http_response_code(401);
                $response = ['success' => false, 'error' => 'Authentication required'];
                break;
            }
            $controller = new HiveController();
            $action = $params['action'] ?? '';
            
            // Log the hive request
            error_log("Hive endpoint called with action: " . $action);
            error_log("Hive params: " . print_r($params, true));
            
            // Process the request
            $response = $controller->handleRequest($action, $params);
            break;
            
        case 'production':
            // Check authentication for protected routes
            if (!isset($_SESSION['loggedIn'])) {
                http_response_code(401);
                $response = ['success' => false, 'error' => 'Authentication required'];
                break;
            }
            
            error_log("Production endpoint called with params: " . print_r($params, true));
            
            $controller = new ProductionController();
            
            // Get the action from the request
            $action = '';
            if (isset($params['action']) && !empty($params['action'])) {
                $action = $params['action'];
                error_log("Action from params: " . $action);
            } else {
                error_log("No action parameter found in request");
                $response = ['success' => false, 'error' => 'No action specified'];
                break;
            }
            
            // Process the request
            $response = $controller->handleRequest($action, $params);
            break;
            
        case 'equipment':
            // Check authentication for protected routes
            if (!isset($_SESSION['loggedIn'])) {
                http_response_code(401);
                $response = ['success' => false, 'error' => 'Authentication required'];
                break;
            }
            $controller = new EquipmentController();
            $action = $params['action'] ?? '';
            unset($params['action']); // Remove action from params
            $response = $controller->handleRequest($action, $params);
            break;
            
        case 'health':
            // Check authentication for protected routes
            if (!isset($_SESSION['loggedIn'])) {
                http_response_code(401);
                $response = ['success' => false, 'error' => 'Authentication required'];
                break;
            }
            $controller = new HealthController();
            $action = $params['action'] ?? '';
            unset($params['action']); // Remove action from params
            $response = $controller->handleRequest($action, $params);
            break;
            
        case 'reports':
            // Check authentication for protected routes
            if (!isset($_SESSION['loggedIn'])) {
                http_response_code(401);
                $response = ['success' => false, 'error' => 'Authentication required'];
                break;
            }
            $controller = new ReportsController();
            $action = $params['action'] ?? '';
            
            // Log the reports request
            error_log("Reports endpoint called with action: " . $action);
            error_log("Reports params: " . print_r($params, true));
            
            // Process the request
            $response = $controller->handleRequest($action, $params);
            break;
            
        case '':
            // Root API endpoint - show available endpoints
            $response = [
                'success' => true,
                'message' => 'Beekeeping Inventory Management System API',
                'endpoints' => [
                    'auth' => ['login', 'register', 'resetPassword'],
                    'beehive' => ['add', 'update', 'delete', 'getAll', 'getById', 'getByStatus', 'getHealthHistory', 'getProductionHistory', 'getSummary'],
                    'production' => ['add', 'update', 'delete', 'getAllProduction', 'getReport'],
                    'equipment' => ['add', 'update', 'delete', 'getAll', 'getById', 'getByType', 'getByCondition', 'getInventorySummary'],
                    'health' => ['add', 'update', 'delete', 'getAll', 'getById', 'getByHive', 'getByDateRange', 'getSummary', 'getIssues'],
                    'reports' => ['getReport']
                ]
            ];
            break;
            
        default:
            http_response_code(404);
            $response = ['success' => false, 'error' => 'Endpoint not found: ' . $endpoint];
    }
} catch(PDOException $e) {
    error_log('Database error: ' . $e->getMessage());
    http_response_code(500);
    $response = ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
} catch(Exception $e) {
    error_log('API error: ' . $e->getMessage());
    http_response_code(500);
    $response = ['success' => false, 'error' => 'Error: ' . $e->getMessage()];
}

// Output response
echo json_encode($response);