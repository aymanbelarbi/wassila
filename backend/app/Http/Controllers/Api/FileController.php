<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Project;
use App\Models\File;

class FileController extends Controller
{
    public function index(Request $request, Project $project)
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $project->files;
    }

    public function store(Request $request, Project $project)
    {
        if ($project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'nullable|string',
            'language' => 'nullable|string|in:javascript,php,python',
        ]);

        return $project->files()->create($request->all());
    }

    public function show(Request $request, File $file)
    {
        if ($file->project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $file->load('scans');
    }

    public function update(Request $request, File $file)
    {
        if ($file->project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|nullable|string',
            'language' => 'sometimes|nullable|string|in:javascript,php,python',
        ]);

        $file->update($request->all());

        return $file;
    }

    public function destroy(Request $request, File $file)
    {
        if ($file->project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $file->delete();

        return response()->json(['message' => 'File deleted']);
    }
}
