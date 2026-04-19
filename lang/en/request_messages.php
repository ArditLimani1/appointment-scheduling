<?php

return [

    'service' => [
        'resource_quantity' => 'Quantity cannot exceed the resource capacity.',
        'resource_duplicate' => 'Each resource can only be added once.',
    ],

    'booking' => [
        'client_first_name_regex' => 'The first name may only include letters, numbers, spaces, and simple punctuation.',
        'client_last_name_regex' => 'The last name may only include letters, numbers, spaces, and simple punctuation.',
        'client_phone_regex' => 'Enter a valid phone number: optional + followed by 6–20 digits only.',
        'client_email_invalid' => 'Please enter a valid email address.',
        'client_notes_regex' => 'Notes cannot contain angle brackets or HTML.',
        'date_past' => 'The date must be today or later.',
        'date_window' => 'The date is outside the allowed booking window.',
        'start_time_notice' => 'That time is no longer available or does not meet the minimum advance booking requirement.',
        'employee_invalid' => 'The selected employee is not available for this business.',
        'services_invalid' => 'One or more selected services are not available for this business.',
        'services_mismatch' => 'The selected professional does not offer all of the chosen services.',
    ],

    'employee_appointment' => [
        'service_change_disabled' => 'Service changes are disabled by your administrator.',
        'service_invalid_business' => 'Invalid service for this business.',
        'service_not_offered' => 'You do not offer this service.',
    ],

    'settings' => [
        'slug_unique' => 'This booking URL is already used by another registered business.',
    ],

];
