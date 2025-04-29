<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\PlayerModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class PlayerController extends Controller {
  protected object $player;

  public function __construct($param) {
    $this->player = new PlayerModel();

    parent::__construct($param);
  }

  /*========================= POST ==========================================*/

  #[Route("POST", "/back/player"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createPlayer() {
    $this->player->add($this->body);

    return $this->player->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/player/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getPlayer() {
    return $this->player->get(intval($this->params['id']));
  }

  /*========================= GET BY NAME ====================================*/

  #[Route("GET", "/back/player/name/:name"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getPlayerByName() {
    return $this->player->getByName($this->params['name']);
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/player"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getPlayers() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->player->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/player/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updatePlayer() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      $missingFields = array_diff(
        $this->player->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->player->update($data, intval($id));

      return $this->player->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/player/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deletePlayer() {
    return $this->player->delete(intval($this->params['id']));
  }
}

