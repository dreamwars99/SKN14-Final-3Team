from django.db import models
from f_user.models import User
from f_customer.models import Customer

class LoanAssessment(models.Model):
    seq_id = models.BigAutoField(primary_key=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    customer_type = models.CharField(max_length=16, default="INDIVIDUAL")
    product_type = models.CharField(max_length=16, default="CREDIT_LOAN")
    requested_amount = models.DecimalField(max_digits=18, decimal_places=2)
    requested_term = models.IntegerField()
    purpose = models.CharField(max_length=255)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    approval = models.PositiveSmallIntegerField(default=0)  # 0=거절, 1=심사중, 2=승인

    class Meta:
        db_table = "loan_assessment"
