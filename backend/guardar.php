<?php
session_start();

$conn = new mysqli("localhost", "root", "", "empresa");

if ($conn->connect_error) {
  die("Error conexión");
}

function limpiar($conn, $valor) {
  return $conn->real_escape_string(trim($valor));
}

function esGmailValido($correo) {
  return preg_match('/^[a-zA-Z0-9._%+-]+@gmail\.com$/', $correo) === 1;
}

function esAdminSesion() {
  return isset($_SESSION['rol']) && $_SESSION['rol'] === 'admin';
}

function bloquearSiNoAdmin($conn) {
  if (!esAdminSesion()) {
    echo "Acceso denegado";
    $conn->close();
    exit;
  }
}

// --- CERRAR SESIÓN ---
if (isset($_GET['logout'])) {
  session_unset();
  session_destroy();
  echo "OK";
  $conn->close();
  exit;
}

// --- SESIÓN ACTUAL ---
if (isset($_GET['sesion'])) {
  header('Content-Type: application/json; charset=utf-8');
  if (isset($_SESSION['id'])) {
    echo json_encode([
      'ok' => true,
      'id' => $_SESSION['id'],
      'nombre' => $_SESSION['nombre'],
      'correo' => $_SESSION['correo'],
      'rol' => $_SESSION['rol']
    ]);
  } else {
    echo json_encode(['ok' => false]);
  }
  $conn->close();
  exit;
}

// --- LOGIN USUARIOS Y ADMIN ---
if (isset($_POST['login_correo']) && isset($_POST['login_password'])) {
  $correo = limpiar($conn, strtolower($_POST['login_correo']));
  $password = limpiar($conn, $_POST['login_password']);

  header('Content-Type: application/json; charset=utf-8');

  $sql = "SELECT id, nombre, correo, rol FROM usuarios WHERE correo='$correo' AND password='$password' LIMIT 1";
  $result = $conn->query($sql);
  if ($result && $result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $_SESSION['id'] = intval($user['id']);
    $_SESSION['nombre'] = $user['nombre'];
    $_SESSION['correo'] = strtolower($user['correo']);
    $_SESSION['rol'] = $user['rol'];
    echo json_encode([
      'ok' => true,
      'nombre' => $user['nombre'],
      'correo' => strtolower($user['correo']),
      'rol' => $user['rol']
    ]);
  } else {
    echo json_encode([
      'ok' => false,
      'message' => 'Login incorrecto'
    ]);
  }
  $conn->close();
  exit;
}

// --- LISTAR PRODUCTOS ---
if (isset($_GET['productos'])) {
  $sql = "SELECT * FROM productos";
  $result = $conn->query($sql);
  $productos = array();
  while ($row = $result->fetch_assoc()) {
    $productos[] = $row;
  }
  echo json_encode($productos);
  $conn->close();
  exit;
}

// --- AGREGAR PRODUCTO ---
if (isset($_POST['producto_nombre']) && isset($_POST['producto_precio']) && isset($_POST['producto_icono'])) {
  $nombre = limpiar($conn, $_POST['producto_nombre']);
  $precio = floatval($_POST['producto_precio']);
  $icono = limpiar($conn, $_POST['producto_icono']);
  $cantidad = isset($_POST['producto_cantidad']) ? intval($_POST['producto_cantidad']) : 0;
  $sql = "INSERT INTO productos (nombre, precio, icono, cantidad) VALUES ('$nombre', $precio, '$icono', $cantidad)";
  if ($conn->query($sql) === TRUE) {
    echo "Producto agregado";
  } else {
    echo "Error al agregar producto: " . $conn->error;
  }
  $conn->close();
  exit;
}

// --- ELIMINAR PRODUCTO ---
if (isset($_POST['eliminar_producto'])) {
  $id = intval($_POST['eliminar_producto']);
  $sql = "DELETE FROM productos WHERE id=$id";
  if ($conn->query($sql) === TRUE) {
    echo "Producto eliminado";
  } else {
    echo "Error al eliminar producto: " . $conn->error;
  }
  $conn->close();
  exit;
}

// --- ACTUALIZAR CANTIDAD DE PRODUCTO ---
if (isset($_POST['actualizar_cantidad_id']) && isset($_POST['nueva_cantidad'])) {
  $id = intval($_POST['actualizar_cantidad_id']);
  $cantidad = intval($_POST['nueva_cantidad']);
  if ($cantidad < 0) {
    echo "La cantidad no puede ser negativa";
    $conn->close();
    exit;
  }
  $sql = "UPDATE productos SET cantidad=$cantidad WHERE id=$id";
  if ($conn->query($sql) === TRUE) {
    echo "Cantidad actualizada";
  } else {
    echo "Error al actualizar cantidad: " . $conn->error;
  }
  $conn->close();
  exit;
}

// --- LISTAR USUARIOS ---
if (isset($_GET['usuarios'])) {
  bloquearSiNoAdmin($conn);
  $sql = "SELECT id, nombre, correo, rol FROM usuarios ORDER BY id ASC";
  $result = $conn->query($sql);
  $usuarios = array();
  while ($row = $result->fetch_assoc()) {
    $usuarios[] = $row;
  }
  echo json_encode($usuarios);
  $conn->close();
  exit;
}

// --- AGREGAR USUARIO ---
if (isset($_POST['nombre']) && isset($_POST['correo']) && isset($_POST['password'])) {
  $nombre = limpiar($conn, $_POST['nombre']);
  $correo = limpiar($conn, strtolower($_POST['correo']));
  $password = limpiar($conn, $_POST['password']);

  if ($nombre === '' || $correo === '' || $password === '') {
    echo "Faltan datos";
    $conn->close();
    exit;
  }

  if (!esGmailValido($correo)) {
    echo "Solo se permiten correos @gmail.com";
    $conn->close();
    exit;
  }

  $resultCorreo = $conn->query("SELECT id FROM usuarios WHERE correo='$correo' LIMIT 1");
  if ($resultCorreo && $resultCorreo->num_rows > 0) {
    echo "Ese correo ya está registrado";
    $conn->close();
    exit;
  }

  $rol = ($correo === 'admin@gmail.com') ? 'admin' : 'usuario';

  if ($rol === 'admin') {
    $resultAdmin = $conn->query("SELECT id FROM usuarios WHERE rol='admin' AND correo='admin@gmail.com' LIMIT 1");
    if ($resultAdmin && $resultAdmin->num_rows > 0) {
      echo "La cuenta admin@gmail.com ya existe";
      $conn->close();
      exit;
    }
  }

  $sql = "INSERT INTO usuarios (nombre, correo, password, rol) VALUES ('$nombre', '$correo', '$password', '$rol')";
  if ($conn->query($sql) === TRUE) {
    echo "Usuario guardado correctamente";
  } else {
    echo "Error SQL: " . $conn->error;
  }
  $conn->close();
  exit;
}

// --- ACTUALIZAR ROL DE USUARIO ---
if (isset($_POST['actualizar_rol_id']) && isset($_POST['nuevo_rol'])) {
  bloquearSiNoAdmin($conn);
  $id = intval($_POST['actualizar_rol_id']);
  $nuevoRol = ($_POST['nuevo_rol'] === 'admin') ? 'admin' : 'usuario';

  $result = $conn->query("SELECT correo, rol FROM usuarios WHERE id=$id LIMIT 1");
  if (!$result || $result->num_rows === 0) {
    echo "Usuario no encontrado";
    $conn->close();
    exit;
  }

  $usuario = $result->fetch_assoc();
  $correoUsuario = strtolower($usuario['correo']);

  if ($correoUsuario === 'admin@gmail.com' && $nuevoRol !== 'admin') {
    echo "admin@gmail.com debe permanecer como admin";
    $conn->close();
    exit;
  }

  if ($nuevoRol === 'admin' && $correoUsuario !== 'admin@gmail.com') {
    echo "Solo admin@gmail.com puede tener rol admin";
    $conn->close();
    exit;
  }

  $sql = "UPDATE usuarios SET rol='$nuevoRol' WHERE id=$id";
  if ($conn->query($sql) === TRUE) {
    echo "Rol actualizado";
  } else {
    echo "Error al actualizar rol: " . $conn->error;
  }
  $conn->close();
  exit;
}

// --- ELIMINAR USUARIO (NO ADMIN PRINCIPAL) ---
if (isset($_POST['eliminar_usuario'])) {
  bloquearSiNoAdmin($conn);
  $id = intval($_POST['eliminar_usuario']);
  $result = $conn->query("SELECT correo, rol FROM usuarios WHERE id=$id LIMIT 1");
  if ($result && $row = $result->fetch_assoc()) {
    if ($row['rol'] === 'admin' || strtolower($row['correo']) === 'admin@gmail.com') {
      echo "No se puede eliminar al admin principal";
      $conn->close();
      exit;
    }
  }
  $sql = "DELETE FROM usuarios WHERE id=$id";
  if ($conn->query($sql) === TRUE) {
    echo "Usuario eliminado";
  } else {
    echo "Error al eliminar usuario: " . $conn->error;
  }
  $conn->close();
  exit;
}

$conn->close();
?>
