
(defmacro check-expect (form1 form2 &key (equiv 'equal))
  `(with-output
    :off :all :on error
    (make-event
      (b* ((res1 ,form1)
           (res2 ,form2)
           ((when (not (,equiv res1 res2)))
           (prog2$
             (cw "~%Error in CHECK-EXPECT: Check failed (values not equal).~
                   ~%Returned value: ~x0~
                   ~%Expected value: ~x1~%" res1 res2)
             (value-triple (,equiv ,form1 ,form2) :check t)
             )))
        (value '(value-triple :passed)))
      :check-expansion t)))