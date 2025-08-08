MOD = 10**9 + 7

class Solution:
    def calculateCells(self, A, B, C):
        born = [0] * (A + 2)
        total = [0] * (A + 2)
        
        born[1] = 1  # One cell is born on Day 1
        total[1] = 1
        
        for day in range(2, A + 1):
            # New births from parents born on days (day - B) to (day - C + 1)
            start = max(1, day - C + 1)
            end = day - B
            if end >= start:
                born[day] = sum(born[start:end+1]) % MOD
            
            total[day] = (total[day - 1] + born[day]) % MOD
            
            # Subtract the deaths
            if day - C >= 1:
                total[day] = (total[day] - born[day - C] + MOD) % MOD
        
        return total[A]

# Example usage
if __name__ == "__main__":
    A = 5  # Day to calculate
    B = 1   # Days after which cells reproduce
    C = 5   # Days after which cells die

    sol = Solution()
    result = sol.calculateCells(A, B, C)
    print(f"Alive cells on day {A}: {result}")
