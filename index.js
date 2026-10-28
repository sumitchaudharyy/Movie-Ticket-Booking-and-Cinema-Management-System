function cal(nums   ) {
    let sum = 0;            
    for (let i = 0; i < nums.length; i++) {
        sum += nums[i];
    }
    return sum;
} 
console.log(cal([1, 2, 3, 4, 5])); 


function cal(nums) {
    let sum = 0;    
    return nums.reduce((acc, curr) => acc + curr, 0);   
}