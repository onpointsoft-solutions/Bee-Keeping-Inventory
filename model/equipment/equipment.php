<?php
/**
 * Equipment Model
 *
 * Handles all database operations related to equipment.
 */
require_once __DIR__ . '/../BaseModel.php';

class Equipment extends BaseModel {
    protected $table = 'equipment';
    protected $primaryKey = 'equipmentID';

    public function __construct() {
        parent::__construct();
    }

    public function addEquipment($params) {
        return $this->create([
            'name'             => $params['name']             ?? '',
            'type'             => $params['type']             ?? '',
            'quantity'         => $params['quantity']         ?? 0,
            'condition_status' => $params['condition_status'] ?? ($params['condition'] ?? 'New'),
            'purchaseDate'     => $params['purchaseDate']     ?? date('Y-m-d'),
            'notes'            => $params['notes']            ?? '',
            'status'           => 'Active',
        ]);
    }

    public function updateEquipment($params) {
        return $this->update($params['equipmentID'], [
            'name'             => $params['name'],
            'type'             => $params['type'],
            'quantity'         => $params['quantity'],
            'condition_status' => $params['condition_status'] ?? ($params['condition'] ?? 'New'),
            'notes'            => $params['notes'] ?? '',
        ]);
    }

    public function deleteEquipment($equipmentID) {
        // Soft-delete: mark as Inactive
        return $this->update($equipmentID, ['status' => 'Inactive']);
    }

    public function getAllEquipment() {
        return $this->findBy("status = :status", ['status' => 'Active'], 'name', 'ASC');
    }

    public function getEquipmentByType($type) {
        return $this->findBy("type = :type AND status = :status", [
            'type'   => $type,
            'status' => 'Active',
        ], 'name', 'ASC');
    }

    public function getInventoryReport() {
        $query = "SELECT type,
                         COUNT(*)          AS itemCount,
                         SUM(quantity)     AS totalQuantity,
                         GROUP_CONCAT(DISTINCT condition_status) AS conditions
                  FROM equipment
                  WHERE status = 'Active'
                  GROUP BY type
                  ORDER BY type";

        try {
            $report = $this->executeQuery($query);

            $totalItems = array_reduce($report, function ($carry, $item) {
                return $carry + $item['totalQuantity'];
            }, 0);

            return [
                'success'    => true,
                'report'     => $report,
                'totalItems' => $totalItems,
            ];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
