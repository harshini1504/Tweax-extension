# A simple dummy Python program

# Function to greet a user
def greet_user(name):
    print(f"Hello, {name}!")

# Function to calculate the sum of numbers from 1 to n
def calculate_sum(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total

# Main part of the program
if __name__ == "__main__":
    user_name = "Alice"
    greet_user(user_name)  # Greet the user

    number = 5
    result = calculate_sum(number)  # Calculate sum of numbers from 1 to 5
    print(f"The sum of numbers from 1 to {number} is {result}.")
