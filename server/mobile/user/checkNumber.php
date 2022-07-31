<?php

/**
 * @api {post} /user/checkPhone подтвердить телефон по входящему звонку
 * @apiVersion 1.0.0
 * @apiDescription **[метод готов]**
 *
 * @apiGroup User
 *
 * @apiParam {String{11}} userPhone номер телефона
 * @apiParam {String{4}} smsCode код подтверждения
 *
 * @apiErrorExample Ошибки
 * 401 неверный код подтверждения
 * 404 запрос не найден
 * 422 неверный формат данных
 *
 * @apiSuccess {String} accessToken токен авторизации
 * @apiSuccess {Object[]} names имя и отчество
 * @apiSuccess {String} names.name имя
 * @apiSuccess {String} names.patronymic отчество
 */
    $user_phone = @$postdata['userPhone'];
    // $user_phone[0] = '8';
    $user_phone = substr($user_phone,1);
    
    $isdn = loadBackend("isdn");
    
    if (strlen($user_phone) == 11)  {
        
        $result = $isdn->checkIncoming('8'. $user_phone);
        $result2 = $isdn->checkIncoming('+7'. $user_phone);
        $result3 = $isdn->checkIncoming('7'. $user_phone);

        if ($result || $result2 || $result3) {
            response(200, $result2);
        } else {
            response(401);
        }
    } else {
        response(422);
    }
