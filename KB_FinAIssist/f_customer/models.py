from django.db import models
from f_common.models import CIndustryCode, CEducationLevel, CHousingStatus, UncBankLocation, UncEmploymentType

class Customer(models.Model):
    class CustomerType(models.TextChoices):
        INDIVIDUAL = "INDIVIDUAL"
        CORPORATE = "CORPORATE"

    seq_id = models.BigAutoField(primary_key=True)
    customer_type = models.CharField(max_length=16, choices=CustomerType.choices, default=CustomerType.INDIVIDUAL)
    display_name = models.CharField(max_length=255)
    bank_location = models.ForeignKey(UncBankLocation, null=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=16, default="ACTIVE")
    risk_segment = models.CharField(max_length=16, default="RETAIL")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customer"

class CustomerPerson(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, primary_key=True, related_name="person")
    first_name = models.CharField(max_length=64)
    last_name = models.CharField(max_length=64)
    gender = models.PositiveSmallIntegerField()  # 0=남, 1=여
    rrn = models.CharField(max_length=64, unique=True)
    mobile = models.CharField(max_length=32, unique=True)
    email = models.EmailField(unique=True)
    account_number = models.CharField(max_length=64)
    account_amount = models.DecimalField(max_digits=18, decimal_places=2)
    education_level = models.ForeignKey(CEducationLevel, null=True, on_delete=models.SET_NULL)
    housing_status = models.ForeignKey(CHousingStatus, null=True, on_delete=models.SET_NULL)
    income_annual = models.DecimalField(max_digits=18, decimal_places=2)
    work_experience_years = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    employment_type = models.ForeignKey(UncEmploymentType, null=True, on_delete=models.SET_NULL)
    industry_code = models.ForeignKey(CIndustryCode, null=True, on_delete=models.SET_NULL)
    has_delinquency = models.BooleanField(default=False)
    credit_history_length = models.IntegerField(default=0)  # 연수
    credit_rating = models.PositiveSmallIntegerField()

    class Meta:
        db_table = "customer_person"

class CustomerCorporate(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, primary_key=True, related_name="corporate")
    industry_code = models.ForeignKey(CIndustryCode, null=True, on_delete=models.SET_NULL)
    legal_name = models.CharField(max_length=255, unique=True)
    biz_reg_no_masked = models.CharField(max_length=64, unique=True)
    incorporation_date = models.DateField()
    employees_count = models.IntegerField()
    mobile = models.CharField(max_length=32)
    roa = models.DecimalField(max_digits=10, decimal_places=4)
    net_profit_margin = models.DecimalField(max_digits=10, decimal_places=4)
    operating_roa = models.DecimalField(max_digits=10, decimal_places=4)
    operating_margin = models.DecimalField(max_digits=10, decimal_places=4)
    current_ratio = models.DecimalField(max_digits=10, decimal_places=4)
    quick_ratio = models.DecimalField(max_digits=10, decimal_places=4)
    debt_ratio = models.DecimalField(max_digits=10, decimal_places=4)
    equity_ratio = models.DecimalField(max_digits=10, decimal_places=4)
    equity_to_debt_ratio = models.DecimalField(max_digits=10, decimal_places=4)
    long_term_debt_to_equity_ratio = models.DecimalField(max_digits=10, decimal_places=4)
    asset_turnover = models.DecimalField(max_digits=10, decimal_places=4)