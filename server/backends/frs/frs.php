<?php

    /**
    * backends frs namespace
    */

    namespace backends\frs
    {

        use backends\backend;

        /**
         * base frs class
         */
        abstract class frs extends backend
        {

            /**
             * @return mixed
             */
            abstract public function servers();
        }
    }
