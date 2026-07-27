<?php

namespace App\Enums;

enum BookingType: string
{
    case DineIn = 'dine_in';
    case Catering = 'catering';
    case PrivateEvent = 'private_event';
}
