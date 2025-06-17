<?php

namespace back\models;

use \PDO;

class SqlConnect {
  public object $db;
  private string $host;
  private string $port;
  private string $dbname;
  private string $password;
  private string $user;

  public function __construct() {
    $this->host = 'db5018049812.hosting-data.io';
    $this->dbname = $_ENV['DB_NAME'];
    $this->user = $_ENV['DB_USER'];
    $this->password = $_ENV['DB_PASSWORD'];
    $this->port = $_ENV['DB_PORT'];

    $dsn = 'mysql:host='.$this->host.';port='.$this->port.';dbname='.$this->dbname;
    $this->db = new PDO(
      $dsn,
      $this->user,
      $this->password
    );

    $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $this->db->setAttribute(PDO::ATTR_PERSISTENT, false);
  }

  public function transformDataInDot($data) {
    $dataFormated = [];

    foreach ($data as $key => $value) {
      $dataFormated[':' . $key] = $value;
    }

    return $dataFormated;
  }
}