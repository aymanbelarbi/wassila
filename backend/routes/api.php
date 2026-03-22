<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\ScanController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'update']);
    Route::delete('/profile', [AuthController::class, 'destroy']);

    Route::apiResource('projects', ProjectController::class);
    Route::get('projects/{project}/files', [FileController::class, 'index']);
    Route::post('projects/{project}/files', [FileController::class, 'store']);
    
    Route::apiResource('files', FileController::class)->except(['index', 'store']);
    Route::apiResource('scans', ScanController::class)->except(['update']);
});
