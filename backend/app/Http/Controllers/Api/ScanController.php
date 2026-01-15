<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Scan;

class ScanController extends Controller
{
    public function index(Request $request)
    {
        $query = Scan::query();

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('file_id')) {
            $query->where('file_id', $request->file_id);
        }

        // Basic security: only show scans if user owns the project
        $query->whereHas('project', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        });

        return $query->with(['file', 'project'])->latest()->get();
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'project_id' => 'required|exists:projects,id',
                'file_id' => 'nullable|exists:files,id',
                'score' => 'required|integer|min:0|max:100',
                'issues' => 'present|array',
                'ai_summary' => 'nullable|string',
                'fixed_code' => 'nullable|string',
            ]);

            // Security: Verify ownership of project
            $project = \App\Models\Project::findOrFail($validated['project_id']);
            if ($project->user_id !== $request->user()->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Security: Verify file belongs to project
            if (isset($validated['file_id'])) {
                $file = \App\Models\File::findOrFail($validated['file_id']);
                if ($file->project_id !== $project->id) {
                    return response()->json(['message' => 'File does not belong to this project'], 422);
                }
            }

            return Scan::create($validated);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Scan validation failed:', [
                'errors' => $e->errors(),
                'received' => $request->all(),
                'user_id' => $request->user()->id
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
                'received' => $request->all()
            ], 422);
        }
    }

    public function show(Request $request, Scan $scan)
    {
        if ($scan->project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $scan->load('project', 'file');
    }

    public function destroy(Request $request, Scan $scan)
    {
        if ($scan->project->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $scan->delete();
        return response()->json(['message' => 'Scan deleted']);
    }
}
