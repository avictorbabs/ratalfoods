<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(): Response
    {
        $posts = BlogPost::query()
            ->published()
            ->orderByDesc('published_at')
            ->get();

        return Inertia::render('public/Blog', [
            'posts' => $posts,
        ]);
    }

    public function show(BlogPost $post): Response
    {
        abort_unless(
            $post->is_published && $post->published_at && $post->published_at->lte(now()),
            404
        );

        $recentPosts = BlogPost::query()
            ->published()
            ->where('id', '!=', $post->id)
            ->orderByDesc('published_at')
            ->limit(5)
            ->get();

        return Inertia::render('public/BlogShow', [
            'post' => $post,
            'recentPosts' => $recentPosts,
        ]);
    }
}
