<?php

namespace App\Support;

use RuntimeException;

/**
 * A chosen variation or add-on that does not exist or is not allowed. The message is written for customers.
 */
class LineOptionException extends RuntimeException {}
