Export XTCE
===========

Export an XTCE representation of a space system::

    GET /api/mdb/{instance}/space-systems/{name*}:exportXTCE


.. note::

    The output is in XTCE 1.1 format.


.. rubric:: Parameters

name (string)
    The space system to export. A top-level system leads to best results.
