<?php

return [

    /*
    | Abandoned cart reminders: wait this long after the last checkout activity
    | before emailing, and give up on carts older than the max age.
    */
    'abandoned_cart_delay_minutes' => (int) env('ABANDONED_CART_DELAY_MINUTES', 60),
    'abandoned_cart_max_age_hours' => (int) env('ABANDONED_CART_MAX_AGE_HOURS', 72),

    /*
    | Review requests: days after an order is completed before we ask for a
    | review, and how long we keep trying.
    */
    'review_request_delay_days' => (int) env('REVIEW_REQUEST_DELAY_DAYS', 2),
    'review_request_max_age_days' => (int) env('REVIEW_REQUEST_MAX_AGE_DAYS', 30),

    /*
    | Recurring orders: how many days ahead of the service date the order is
    | created (and the customer is emailed a skip link), and how many active
    | repeat schedules one customer may have.
    */
    'recurring_lead_days' => (int) env('RECURRING_LEAD_DAYS', 2),
    'recurring_max_active' => (int) env('RECURRING_MAX_ACTIVE', 3),

];
