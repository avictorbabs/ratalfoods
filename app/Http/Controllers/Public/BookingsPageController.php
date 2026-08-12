<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\PageContent;
use Inertia\Inertia;
use Inertia\Response;

class BookingsPageController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('public/Bookings', [
            'pageContent' => PageContent::resolved('booking'),
        ]);
    }
}
