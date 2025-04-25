<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\MoveCategoryModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class MoveCategoryController extends Controller {
  protected object $moveCategory;

  public function __construct($param) {
    $this->moveCategory = new MoveCategoryModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/move_category"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createMoveCategory() {
    $this->moveCategory->add($this->body);

    return $this->moveCategory->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/move_category/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getMoveCategory() {
    return $this->moveCategory->get(intval($this->params['id']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/move_category"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getMoveCategories() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->moveCategory->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/move_category/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateMoveCategory() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->moveCategory->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->moveCategory->update($data, intval($id));

      # Let's return the updated moveCategory
      return $this->moveCategory->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/move_category/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteMoveCategory() {
    return $this->moveCategory->delete(intval($this->params['id']));
  }
}