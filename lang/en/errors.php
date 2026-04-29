<?php

return [

    'unauthorized' => 'Unauthorized.',

    'booking' => [
        'time_not_available' => 'This time is not available.',
        'time_no_longer_available' => 'This time is no longer available.',
        'shared_resource_unavailable' => 'A required shared resource is not available for this time.',
    ],

    'shared_resource' => [
        'delete_blocked' => 'This resource cannot be deleted while it is linked to past or upcoming appointments.',
    ],

    'schedule' => [
        'booking_slug_taken' => 'This booking URL is already being used by another team member.',
    ],

    'appointment' => [
        'service_not_found' => 'Service not found.',
        'slot_conflict_employee' => 'This time slot conflicts with another appointment for this employee. Please choose a different time or date where the employee is available.',
        'slot_conflict' => 'This time slot conflicts with another appointment. Please choose a different time or date.',
        'cannot_edit_cancelled' => 'Cannot edit a cancelled appointment.',
        'cannot_reschedule_cancelled' => 'Cannot reschedule a cancelled appointment.',
        'employee_service_not_offered' => 'You do not offer this service.',
        'outside_hours' => 'This time is outside working hours or is not available.',
        'overlaps_break' => 'This time is outside working hours or overlaps a break.',
    ],

    'booking_flow' => [
        'employee_invalid' => 'The selected employee is not available for this business.',
        'select_service' => 'Select at least one service.',
        'service_invalid' => 'The selected service is not available for this business.',
        'services_mismatch' => 'The selected staff member does not offer all of the chosen services.',
    ],

];
