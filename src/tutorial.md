# ACL2torial

ACL2 is:

* _A Computational Logic_: A complex mechanized theorem prover that can reason about code written in...
* _Applicative Common Lisp_: A significantly restricted subset of Common Lisp that doesn't allow for variables to be modified in place.

ACL2 uses a subset of the Lisp programming language. Lisp syntax is one of the simplest ones of any programming language. However, it is different from most other languages, so let's take a moment to get acquainted with it.

Or, if you're already familiar with Lisp and recursive functions, you can skip right to the fun stuff. Keep in mind as you try things that ACL2 is a subset of Lisp, so most of what you know might not work.

---

## Lisp basics

First of all, every operation in Lisp is a function\* -- even very basic mathematical operations, such as addition. Secondly, functions are called in a different way than they are in mathematics or in most other languages. While in most languages you would write `f(x, y)`, in Lisp, you write `(f x y)`.

The addition function is called `+`. Try adding two numbers now:

    (+ 1 2)

> TIP: You can click on any code you see in this tutorial to insert it at the prompt.

\* Technically, this is only partially true, but it's good enough for us for now.

---

ACL2 has many built-in data types, but we're only going to work with two: numbers and lists. Lists are a fundamental part of how Lisp represents and manipulates data. The function used to create a list is called, appropriately, `list`:

    (list 8 6 7 5 3 0 9)

There are several built-in functions that act on lists, such as

    (append (list 1 2 3) (list 4 5 6)) ; (list 1 2 3 4 5 6)

<!--sep-->

    (cons 1 (list 2 3 4)) ; (list 1 2 3 4)

<!--sep-->

    (first (list 1 2 3)) ; 1

<!--sep-->

    (rest (list 1 2 3)) ; (list 2 3)

---

We can also define our own functions To do that, we use the special form "defun".

> `(defun` _name_ `(` _arguments_ `)` _body_ `)`

Here's an example:

    (defun triple (x) (* 3 x))

This new function `triple` will triple any number you pass into it. Click above to define it, then try it out:

    (triple 10) ; 30

Next, let's try a function that works on lists:

    (defun snoc (xs elem)
      (append xs
              (list elem))

This function takes in two arguments: a list, and an element to be added to that list at the end. It's like a backwards version of `cons`, which is why I called it `snoc`. Try it out!

---

Another important type of built-in function is a predicate. These end in "p" and are used to test whether some condition holds for the values you pass in. Here are some examples:

    (evenp 8) ; checks whether 8 is an even number

<!--sep-->

    (endp (list 1 2)) ; checks whether a list is empty -- "at the end"

Functions can take into account the results of these predicates using `if`. Here's an example:

    (defun hailstone (x)
      (if (evenp x) ; condition
          (/ x 2) ; what to do if it passes
          (+ (* 3 x) 1))) ; what to do if it fails

Try out our new function and see what it does for even and odd numbers:

    (hailstone 34)

<!--sep-->

    (hailstone 35)

---

## Functions

It's annoying to type long function definitions into the console, so we're going to change things up a bit. From now on, when you click on a longer example, it won't go into the console; it will go into the new definitions area below. Code you type in the definitions area isn't run until you click the blue "Run" button.

Next, we're going to enter a recursive function; `factorial`. The factorial of a natural number is the product of the number and all the natural numbers below it. In other words, `(factorial n)` = `(* n (factorial (- n 1)))`. As a special case (called the "base case"), `(factorial 0)` = 1. An approach might be this:

    (defun factorial-almost (n)
      (if (= n 0)
          1
          (* n (factorial-almost (- n 1)))))

Try it out -- add it to the definitions area, run it, and see if you can find the problem.

---

Did you figure it out? If not, try running this:

    (factorial-almost -1)

<!--sep-->

    (factorial-almost 1/2)

Oops. The factorial operation is not well-defined for negative numbers or fractions. It's easy to see why this doesn't work. Here's what ACL2 does:

> `(factorial-almost -1)` is n = 0? No.
> `(* -1 (factorial-almost (- 1 1)))`
> `(* -1 (factorial-almost -2))` is n = 0? No.
> `(* -1 (* -2 (factorial-almost -3)))` is n = 0? No.
> `(* -1 (* -2 (* -3 (factorial-almost -4))))` etc.

This would continue forever if it wasn't for a recursion limit in the Lisp interpreter. Instead, you get a "stack overflow" error.

---

You might be tempted to say "too bad, don't use it that way", which makes sense. But with ACL2, our goal is to be able to prove theorems about `factorial`, and it's impossible to prove anything about a function that might or might not terminate. So in order to continue, we need a version of `factorial` that is **total** -- that is, it returns a value no matter what the input is.

Thankfully, this is a common problem, and ACL2 has a solution. There's a special predicate that will do what we want here. It's `zp` -- the "zero predicate". What it says is, roughly, "check if the argument is a non-negative integer, and if so, whether or not it's zero". If the argument is zero _or_ if the argument is not an integer -- if it's one of the arguments we consider invalid for `factorial` -- then we will return `1`. It might not make sense that `(factorial -1)` is equal to `1`, but it isn't important for our purposes.

`zp` also uses an ACL2 feature called guards. This prevents you from calling it with an invalid argument.

Now we can define `factorial` correctly:

    (defun factorial (n)
      (if (zp n)
          1
          (* n (factorial (- n 1)))))

---

## Theorems

In addition to the "Run" button, now you'll notice a green "Verify" button. This works a little differently from "Run". It will take the code from the definitions area and run it through the ACL2 logic. For a function definition, that means it will verify that the function terminates for _any_ input, since that's required for proving anything about the function.

If you still have the definition for `factorial-almost`, you can see what I mean. Click the `verify` button and peek at the output -- compare it to the output for a non-recursive function, or for the correct `factorial` definition. Once you're satisfied, you can delete the incorrect definition.

The "Run" button is still useful if you want to be able to run a function that doesn't always terminate. Running a function with some test inputs like we did before is sometimes a good way to find out _why_ it doesn't always terminate.

Now that we can bring our functions into the logical world of ACL2, we can finally get to the cool stuff: theorem proving. Theorems are written with `thm` -- try it out:

    (thm (= (* x 2) (+ x x))) ; QED

    (thm (> (factorial n) 0)) ; QED

    (thm (> x (/ x 2))) ; Fails -- can you tell why?

---

Let's prove that the built in `append` function from earlier is associative; that is, `(append (append xs ys) zs)` equals `(append xs (append ys zs))`.

    (thm (equal (append (append xs ys) zs)
                (append xs (append ys zs))))

This is a long, (but interesting!) proof. If you're interested in the details, there's a good, relatively non-technical discussion of this proof by the authors of ACL2 [here](http://www.cs.utexas.edu/users/moore/acl2/manuals/current/manual/?topic=ACL2____The_02Proof_02of_02the_02Associativity_02of_02App).

For theorems that ACL2 can't prove on its own, you'll often have to provide lemmas; theorems that are added to the ACL2 logical world and can then be used in proving future theorems. To add a theorem to the logical world, use `(defthm ...)` and give it a name.

    (defthm append-associative
      (equal (append (append xs ys) zs)
             (append xs (append ys zs))))

---

One final note before we move on to more advanced theorems.

Theorems added using `defthm` must be written with care; the prover blindly replaces the left side with the right side whenever it finds something that looks like the left side and can prove all of the `implies` hypotheses. If we admitted a different version of append-associative that converted `(append xs (append ys zs))` to `(append (append xs ys))`, the theorem prover would loop forever, applying these two rules repeatedly.

---

## Lists and more theorems

For our next set of theorems, try writing a function definition yourself. We want a function called `sum` that adds up all of the elements in a list. So it should work like this:

    (sum (list 8 6 7 5 3 0 9)) ; 38

Keep in mind some functions and predicates we defined earlier

    (endp xs) ; Tests if there are any elements in xs
    (first xs) ; Gets the first element of xs
    (rest xs) ; A list of all the elements except the first

Go to the next section if you need a hint.

---

Our approach to this function should be similar to what we did for `factorial`. Instead of a number, we're now dealing with a list, so instead of checking for zero, let's check for an empty list. That is, the structure should look like

    (defun sum (xs)
      (if (endp xs)
          ... ; What is the sum of everything in an empty list?
          ... ; How can we get the sum using first, rest, and sum itself?
          ))

Don't worry too much if it still isn't clear; you'll get to see more examples of this kind of function.

---

You may have come up with something like this:

    (defun sum (xs)
      (if (endp xs)
          0
          (+ (first xs)
             (sum (rest xs)))))

Try to come up with some theorems that verify reasonable properties of `sum`

---

Here are a few examples that demonstrate some of the capabilities of ACL2

    (thm (= (sum (list a b c))
            (+ a b c)))

<!--sep-->

    (thm (= (sum (append xs ys))
            (+ (sum xs) (sum ys))))

<!--sep-->

    (thm (= (sum (reverse xs))
            (sum xs)))

---

## When proofs fail

So far, all of the theorems we've worked on have been successful on the first try. These proofs are interesting, but ACL2 users rarely look closely at successful proofs. The tricky cases, as a user, are trying to diagnose why a proof attempt failed.

Generally, of course, there are two reasons a proof attempt will fail:

1. The theorem, as stated, isn't true.
2. ACL2 needs some guidance.

In my experience, (1) is vastly more common than (2), so we'll start with an example of that.

---

First, we need to define a new function, `rep`. It takes two arguments; let's call them `x` and `n`. `(rep x n)` returns a list with `x` repeated `n` times. Example:

    (rep 2 5) ; (list 2 2 2 2 2)

As a reminder, to add an item to a list, use the `cons` function:

    (cons 3 (list 4 5)) ; (list 3 4 5)

Take a pass at defining `rep` now, and go to the next page if you need a hint.

---

Similar to `factorial`, we want `rep` to recurse towards zero. We can use the `zp` predicate:

    (defun rep (x n)
      (if (zp n)
          ... ; What to do if n is 0
          ... ; What to do if n is not zero
      ))

You can produce an empty list by calling `(list)` with no arguments, or, equivalently, you can just use `nil` (Lisp's special name for an empty list) or `()`.

The next page has the solution.

---

You might have come up with a definition for `rep` similar to this one:

    (defun rep (x n)
      (if (zp n)
          nil
          (cons x
                (rep x (- n 1)))))

---

    (thm (= (sum (rep 1 n))
            n))

Fails with `(IMPLIES (ZP N) (EQUAL 0 N))`

    (thm (implies (natp n)
                  (= (sum (rep 1 n))
                     n)))

---

<!--

    (rev (list 8 6 7 5 3 0 9)) ; (list 9 0 3 5 7 6 8)

***


    (defun rev (xs)
      (if (endp xs)
          nil
          (append (rev (rest xs))
                  (list (first xs)))))

    (defthm rev-rev
      (implies (true-listp xs)
               (equal (rev (rev xs))
                      xs)))

-->
