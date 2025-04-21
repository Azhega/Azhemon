<?php

define('JWT_SECRET', $_ENV['JWT_SECRET']);
define('JWT_ISSUER', 'azhemon-auth.azh:89');
define('JWT_AUDIENCE', 'azhemon-game-api');

define('ACCESS_TOKEN_EXPIRATION', 15 * 60);
define('REFRESH_TOKEN_EXPIRATION', 30 * 24 * 3600);

?>
