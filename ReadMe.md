# ReadMe

### 1. `None`,`True`, `False`

I use number `-1`, `1`, `0`to represent `None`, `True` and `False`  seperately in WASM.

And in order to print the boolean result, I will check the parameter type in call function, if the type is `bool`, I will call `print_bool` function. If the parameter result is `True`,  then `True ` will be printed, otherwise `False` will be printed which is shown below.

![Screen Shot 2022-04-13 at 23.29.28](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.29.28.png)

![Screen Shot 2022-04-13 at 23.30.20](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.30.20.png)

### 2. exmaple

I will use a simple example here

```python
x : int = 1
def f(x: int)->int:
    y: int = 3
    return x + y

f(x)
```

In this example, I define one global variable, one variable in the function and the function has one parameter. In the type check program,  it will generate global variable map first, just like the picture shown below

![Screen Shot 2022-04-13 at 23.38.32](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.38.32.png)

When it comes across a function definition, it will add to functions map which will records its parameters types and return type. And in the "call" statement, the parameter will be loaded as local variables as well as the variables defined in the function.



### 3. infinite loop

I use Safari as my web browser, and it did't respond and the print in the result doesn't show anything. ![Screen Shot 2022-04-13 at 23.44.11](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.44.11.png)

![Screen Shot 2022-04-13 at 23.44.28](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.44.28.png)

![Screen Shot 2022-04-13 at 23.53.58](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.53.58.png)

And for a long the Safari give me a feedback.

I think maybe it is because the Safari will detect the abnormal memory consuming?



### 4. Different Scenario

(1)   one operand is a call expression and the other operand is a variable

![Screen Shot 2022-04-13 at 23.56.02](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.56.02.png)

(2) A program that has a type error in a conditional position

![Screen Shot 2022-04-13 at 23.57.53](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-13 at 23.57.53.png)

I didn't deal with particularly, but if above the while scope, the `x` is not define, then it cann't be success in binary expression.

(3) multiple iterations and call function![Screen Shot 2022-04-14 at 00.08.04](/Users/lynnz/Desktop/Screen Shot 2022-04-14 at 00.08.04.png)

(4) Actually, I didn't implemet `break` and `if` successfully, I have see the if else statment in WASM and realize I need write a resursive function, but I am not sure how to add flow control generator into the statement generator.

(5) Printing an integer and a boolean

![Screen Shot 2022-04-14 at 00.04.03](/Users/lynnz/Desktop/Screen Shot 2022-04-14 at 00.04.03.png)

(6) and (7) I still cann't write, because I didn't implement the flow control. I have already completed its parse and type check. 

### 5. Codes

In the (1) in question 4, I will store the type of call function in `a`, the annotation which is same as return type and type of variables in variables map.Then I will check the type of call fucntion expression and the type of variables. If the type doesn't match, it will throw the error.

 ![Screen Shot 2022-04-14 at 00.17.15](/Users/lynnz/Library/Application Support/typora-user-images/Screen Shot 2022-04-14 at 00.17.15.png)